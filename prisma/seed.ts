import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Cleaning existing data...')
  
  await prisma.edge.deleteMany()
  await prisma.node.deleteMany()
  await prisma.workflow.deleteMany()
  
  console.log('✅ Cleanup complete!')
  console.log('🌱 Seeding database...')
  
  const userId = 'user_demo'
  
  const workflow = await prisma.workflow.create({
    data: {
      name: 'Product Marketing Workflow',
      description: 'Analyze product images and generate marketing content',
      userId: 'sample_user',
      viewport: { x: 0, y: 0, zoom: 1 },
    },
  })

  console.log('Created workflow:', workflow.id)

  const nodes = [
    {
      id: 'image-1',
      workflowId: workflow.id,
      type: 'image',
      position: { x: 100, y: 100 },
      data: { label: 'Product Photo 1' },
    },
    {
      id: 'image-2',
      workflowId: workflow.id,
      type: 'image',
      position: { x: 100, y: 250 },
      data: { label: 'Product Photo 2' },
    },
    {
      id: 'image-3',
      workflowId: workflow.id,
      type: 'image',
      position: { x: 100, y: 400 },
      data: { label: 'Product Photo 3' },
    },
    {
      id: 'text-1',
      workflowId: workflow.id,
      type: 'text',
      position: { x: 100, y: 550 },
      data: {
        label: 'System Prompt',
        text: 'You are an expert product analyst and copywriter.',
      },
    },
    {
      id: 'text-2',
      workflowId: workflow.id,
      type: 'text',
      position: { x: 100, y: 700 },
      data: {
        label: 'Product Details',
        text: 'Analyze these product images and extract key features, colors, materials, and unique selling points',
      },
    },
    {
      id: 'llm-1',
      workflowId: workflow.id,
      type: 'llm',
      position: { x: 500, y: 300 },
      data: {
        label: 'Analyze Product',
        model: 'gemini-1.5-flash',
        temperature: 0.7,
      },
    },
    {
      id: 'llm-2',
      workflowId: workflow.id,
      type: 'llm',
      position: { x: 900, y: 100 },
      data: {
        label: 'Write Amazon Listing',
        model: 'gemini-1.5-flash',
        temperature: 0.8,
      },
    },
    {
      id: 'llm-3',
      workflowId: workflow.id,
      type: 'llm',
      position: { x: 900, y: 350 },
      data: {
        label: 'Write Instagram Caption',
        model: 'gemini-1.5-flash',
        temperature: 0.9,
      },
    },
    {
      id: 'llm-4',
      workflowId: workflow.id,
      type: 'llm',
      position: { x: 900, y: 600 },
      data: {
        label: 'Write SEO Meta Description',
        model: 'gemini-1.5-flash',
        temperature: 0.7,
      },
    },
    {
      id: 'text-3',
      workflowId: workflow.id,
      type: 'text',
      position: { x:900, y: 900 },
      data: {
        label: 'Amazon Listing Prompt',
        text: 'Based on the analysis, write a compelling Amazon product listing with title, bullet points, and description.',
      },
    },
    {
      id: 'text-4',
      workflowId: workflow.id,
      type: 'text',
      position: { x: 950, y: 950 },
      data: {
        label: 'Instagram Prompt',
        text: 'Create an engaging Instagram caption with emojis and hashtags.',
      },
    },
    {
      id: 'text-5',
      workflowId: workflow.id,
      type: 'text',
      position: { x: 1000, y: 1000 },
      data: {
        label: 'SEO Prompt',
        text: 'Write an SEO-optimized meta description (max 160 characters).',
      },
    },
  ]

  await prisma.node.createMany({ data: nodes })

  const edges = [
    {
      id: 'edge-1',
      workflowId: workflow.id,
      source: 'image-1',
      target: 'llm-1',
      sourceHandle: 'image-output',
      targetHandle: 'images-input',
    },
    {
      id: 'edge-2',
      workflowId: workflow.id,
      source: 'image-2',
      target: 'llm-1',
      sourceHandle: 'image-output',
      targetHandle: 'images-input',
    },
    {
      id: 'edge-3',
      workflowId: workflow.id,
      source: 'image-3',
      target: 'llm-1',
      sourceHandle: 'image-output',
      targetHandle: 'images-input',
    },
    {
      id: 'edge-4',
      workflowId: workflow.id,
      source: 'text-1',
      target: 'llm-1',
      sourceHandle: 'text-output',
      targetHandle: 'system_prompt-input',
    },
    {
      id: 'edge-5',
      workflowId: workflow.id,
      source: 'text-2',
      target: 'llm-1',
      sourceHandle: 'text-output',
      targetHandle: 'user_message-input',
    },
    {
      id: 'edge-6',
      workflowId: workflow.id,
      source: 'llm-1',
      target: 'llm-2',
      sourceHandle: 'text-output',
      targetHandle: 'user_message-input',
    },
    {
      id: 'edge-7',
      workflowId: workflow.id,
      source: 'llm-1',
      target: 'llm-3',
      sourceHandle: 'text-output',
      targetHandle: 'user_message-input',
    },
    {
      id: 'edge-8',
      workflowId: workflow.id,
      source: 'llm-1',
      target: 'llm-4',
      sourceHandle: 'text-output',
      targetHandle: 'user_message-input',
    },
    {
      id: 'edge-9',
      workflowId: workflow.id,
      source: 'text-3',
      target: 'llm-2',
      sourceHandle: 'text-output',
      targetHandle: 'system_prompt-input',
    },
    {
      id: 'edge-10',
      workflowId: workflow.id,
      source: 'text-4',
      target: 'llm-3',
      sourceHandle: 'text-output',
      targetHandle: 'system_prompt-input',
    },
    {
      id: 'edge-11',
      workflowId: workflow.id,
      source: 'text-5',
      target: 'llm-4',
      sourceHandle: 'text-output',
      targetHandle: 'system_prompt-input',
    },
  ]

  await prisma.edge.createMany({ data: edges })

  console.log('Sample workflow created successfully!')
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
