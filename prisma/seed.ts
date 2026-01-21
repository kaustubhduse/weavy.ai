import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Cleaning existing data...')
  
  await prisma.edge.deleteMany()
  await prisma.node.deleteMany()
  await prisma.workflow.deleteMany()
  
  console.log('✅ Cleanup complete!')
  console.log('🌱 Seeding database...')
  
  const userId = 'sample_user'
  
  // Create the comprehensive marketing workflow
  const workflow = await prisma.workflow.create({
    data: {
      name: 'Workflow-1',
      description: 'Professional marketing content generator with image and video processing',
      userId: userId,
      viewport: { x: 0, y: 0, zoom: 1 },
    },
  })

  console.log('Created workflow:', workflow.id)

  // Define all nodes with proper data structure
  const nodes = [
    {
      id: 'text-1768645040538',
      workflowId: workflow.id,
      type: 'text',
      position: { x: 176, y: 35 },
      data: {
        text: 'You are a professional marketing copywriter. Generate a compelling one-paragraph product descripton',
        label: 'Text Node-1',
      },
    },
    {
      id: 'text-1768645043539',
      workflowId: workflow.id,
      type: 'text',
      position: { x: 175.7997827403863, y: 242.3998913701931 },
      data: {
        text: 'Product: Wireless Bluetooth Headphones.\nFeatures: Noise cancellation, 30-hour battery, foldable design.',
        label: 'Text Node-2',
      },
    },
    {
      id: 'upload-image-1768645111874',
      workflowId: workflow.id,
      type: 'upload-image',
      position: { x: 177.3928217798758, y: 473.1866212280131 },
      data: {
        label: 'Upload Image',
        fileName: 'headphones.jpg',
        imageData: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      },
    },
    {
      id: 'crop-image-1768645150506',
      workflowId: workflow.id,
      type: 'crop-image',
      position: { x: 747.4383886255923, y: 495.8530805687204 },
      data: {
        x: 0,
        y: 0,
        label: 'Crop Image',
        width: 80,
        height: 80,
      },
    },
    {
      id: 'llm-1768645295861',
      workflowId: workflow.id,
      type: 'llm',
      position: { x: 1104.803676115288, y: 117.5341616689827 },
      data: {
        label: 'Run Any LLM',
        model: 'gemini-2.0-flash-lite',
        temperature: 0.7,
      },
    },
    {
      id: 'upload-video-1768645325887',
      workflowId: workflow.id,
      type: 'upload-video',
      position: { x: 172.6995765590615, y: 978.3490772843758 },
      data: {
        label: 'Upload Video',
        fileName: 'videoplayback.mp4',
        videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      },
    },
    {
      id: 'extract-frame-1768645331048',
      workflowId: workflow.id,
      type: 'extract-frame',
      position: { x: 739.9668216993994, y: 1033.692223151726 },
      data: {
        label: 'Extract Frame',
        timestamp: '4',
      },
    },
    {
      id: 'llm-1768645529195',
      workflowId: workflow.id,
      type: 'llm',
      position: { x: 1885.58516003774, y: 477.7707235738891 },
      data: {
        label: 'Run Any LLM',
        model: 'gemini-2.0-flash-lite',
        temperature: 0.7,
      },
    },
    {
      id: 'text-1768645541249',
      workflowId: workflow.id,
      type: 'text',
      position: { x: 1481.142368298401, y: 74.67453864218783 },
      data: {
        text: 'You are a asocial media manager. Create a tweet-length marketing post based on the product image and video frame.',
        label: 'Text-Node-3',
      },
    },
  ]

  await prisma.node.createMany({ data: nodes })

  // Define all edges with proper connections
  const edges = [
    {
      id: 'xy-edge__upload-image-1768645111874image-output-crop-image-1768645150506image-url-input',
      workflowId: workflow.id,
      source: 'upload-image-1768645111874',
      target: 'crop-image-1768645150506',
      sourceHandle: 'image-output',
      targetHandle: 'image-url-input',
      type: 'default',
    },
    {
      id: 'xy-edge__text-1768645040538prompt-output-llm-1768645295861system_prompt-input',
      workflowId: workflow.id,
      source: 'text-1768645040538',
      target: 'llm-1768645295861',
      sourceHandle: 'prompt-output',
      targetHandle: 'system_prompt-input',
      type: 'default',
    },
    {
      id: 'xy-edge__text-1768645043539prompt-output-llm-1768645295861user_message-input',
      workflowId: workflow.id,
      source: 'text-1768645043539',
      target: 'llm-1768645295861',
      sourceHandle: 'prompt-output',
      targetHandle: 'user_message-input',
      type: 'default',
    },
    {
      id: 'xy-edge__crop-image-1768645150506image-output-llm-1768645295861images-input',
      workflowId: workflow.id,
      source: 'crop-image-1768645150506',
      target: 'llm-1768645295861',
      sourceHandle: 'image-output',
      targetHandle: 'images-input',
      type: 'default',
    },
    {
      id: 'xy-edge__upload-video-1768645325887video-output-extract-frame-1768645331048video-url-input',
      workflowId: workflow.id,
      source: 'upload-video-1768645325887',
      target: 'extract-frame-1768645331048',
      sourceHandle: 'video-output',
      targetHandle: 'video-url-input',
      type: 'default',
    },
    {
      id: 'xy-edge__text-1768645541249prompt-output-llm-1768645529195system_prompt-input',
      workflowId: workflow.id,
      source: 'text-1768645541249',
      target: 'llm-1768645529195',
      sourceHandle: 'prompt-output',
      targetHandle: 'system_prompt-input',
      type: 'default',
    },
    {
      id: 'xy-edge__llm-1768645295861text-output-llm-1768645529195user_message-input',
      workflowId: workflow.id,
      source: 'llm-1768645295861',
      target: 'llm-1768645529195',
      sourceHandle: 'text-output',
      targetHandle: 'user_message-input',
      type: 'default',
    },
    {
      id: 'xy-edge__extract-frame-1768645331048image-output-llm-1768645529195images-input',
      workflowId: workflow.id,
      source: 'extract-frame-1768645331048',
      target: 'llm-1768645529195',
      sourceHandle: 'image-output',
      targetHandle: 'images-input',
      type: 'default',
    },
    {
      id: 'xy-edge__crop-image-1768645150506image-output-llm-1768645529195images-input',
      workflowId: workflow.id,
      source: 'crop-image-1768645150506',
      target: 'llm-1768645529195',
      sourceHandle: 'image-output',
      targetHandle: 'images-input',
      type: 'default',
    },
  ]

  await prisma.edge.createMany({ data: edges })

  console.log('✅ Sample workflow created successfully!')
  console.log(`   - Workflow: ${workflow.name}`)
  console.log(`   - Nodes: ${nodes.length}`)
  console.log(`   - Edges: ${edges.length}`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
